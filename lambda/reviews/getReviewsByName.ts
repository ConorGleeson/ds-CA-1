import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommandOutput, QueryCommand} from "@aws-sdk/lib-dynamodb";

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryString } from "aws-cdk-lib/aws-logs";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {  
    try {
     // Print Event
     console.log("Event: ", event);
     const parameters  = event?.pathParameters;
     const movieId = parameters?.movieId;
     const username = parameters?.username;

    if(!username || !movieId){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No name or movie id" }),
      };
    }

    const commandOutput = await ddbDocClient.send(
        new QueryCommand({
        TableName   : "Reviews",
        KeyConditionExpression: "username = :username and movieId = :movieId",
        ExpressionAttributeValues: {
          ":username": username,
            ":movieId": Number(movieId),
        },
    })
    );

    console.log("GetCommand response: ", commandOutput);
    if(!commandOutput.Items){
        return {
            statusCode: 404,
            headers: {
            "content-type": "application/json",
            },
            body: JSON.stringify({ Message: "Invalid name" }),
        };
    }
    let body = {
        data: commandOutput.Items,
        username: username
    };

    return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      };
    } catch (error: any) { 
      console.log(JSON.stringify(error));
      return {
        statusCode: 500,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ error }),
      };
    }
    };

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



