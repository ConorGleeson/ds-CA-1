import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommandOutput, QueryCommand, QueryCommandInput} from "@aws-sdk/lib-dynamodb";

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
     const type = parameters?.type;

     
     const yearCheck = new RegExp("20[0-9][0-9]")
     

    if(!movieId){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No name or movie id" }),
      };
    }

    if(!type){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No type" }),
      };
    }

    // const commandOutput = await ddbDocClient.send(
    //     new QueryCommand({
    //     TableName   : "Reviews",
    //     KeyConditionExpression: "username = :username and movieId = :movieId",
    //     ExpressionAttributeValues: {
    //       ":username": username,
    //         ":movieId": Number(movieId),
    //     },
    // })
    // );

    const input: QueryCommandInput = {
      TableName   : "Reviews",
      KeyConditionExpression: "movieId = :movieId",
      ExpressionAttributeValues: {
          ":movieId": Number(movieId),
      },
    };
    
    

    let inputType = "";



    if(yearCheck.test(type)){
      input.FilterExpression = "begins_with(reviewDate, :type)";
      input.ExpressionAttributeValues![":type"] = type.substring(0,4);
      inputType = "year";
    }else{
      input.KeyConditionExpression += "username = :type";
      input.ExpressionAttributeValues![":type"] = type;
      inputType = "username";

    }

    const commandOutput = await ddbDocClient.send(
      new QueryCommand(input)
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



