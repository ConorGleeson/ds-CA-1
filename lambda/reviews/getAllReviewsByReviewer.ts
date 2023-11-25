import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommandOutput, ScanCommand, ScanCommandInput} from "@aws-sdk/lib-dynamodb";

import { APIGatewayProxyHandlerV2 } from "aws-lambda";

//scancommand docs https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
const ddbDocClient = createDDbDocClient();



export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
    try {
        const parameters = event?.pathParameters;
        const username = parameters?.username;

        if (!username) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "No username" }),
            };
        }

       const scancommand: ScanCommandInput = {
              TableName: "Reviews",
              FilterExpression: "username = :username",
              ExpressionAttributeValues: {
                ":username": username
              }
            }

            const commandOutput = await ddbDocClient.send(
                new ScanCommand(scancommand)
            );

        if (!commandOutput.Items) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Invalid username" }),
            };
        }


        let body = {
            reviews: commandOutput.Items,
            username: username
        }

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify(body),
        }; 
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
            },
            body: JSON.stringify({ error }),
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