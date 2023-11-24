import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, UpdateCommandInput } from "@aws-sdk/lib-dynamodb";


const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {

    try{
        const parameters  = event?.pathParameters;
        const movieId = parameters?.movieId;
        const username = parameters?.username;
        const body = event.body ? JSON.parse(event.body) : undefined;
        const review = body?.review;

        if (!username || !movieId){
            return{
                statusCode: 400, 
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({Message: "No name or movie id"}),
            }

        }

        const commandOutput = await ddbDocClient.send(
            new UpdateCommand({
            TableName: "Reviews",
            Key: {
                "username": username,
                "movieId": Number(movieId)
            },
            UpdateExpression: "set review = :review",
            ExpressionAttributeValues: {
                ":review": review
            },
        })
        );

        console.log("UpdateCommand response: ", commandOutput);

        return {
            statusCode: 200,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({Message: "Review updated"}),
          };
        

    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ Message: "Review not updated" }),
          };
    }
}
function createDDbDocClient() {
    const ddbClient = new DynamoDBClient({ region: process.env.REGION });
    const marshallOptions = {
      convertEmptyValues: true,
      removeUndefinedValues: true,
      convertClassInstanceToMap: true,
    };
    const unmarshallOptions = {
      wrapNumbers: false,
    };
    const translateConfig = { marshallOptions, unmarshallOptions };
    return DynamoDBDocumentClient.from(ddbClient, translateConfig);
  }
