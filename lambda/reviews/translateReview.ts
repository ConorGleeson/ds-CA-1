import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommandOutput, QueryCommand, QueryCommandInput} from "@aws-sdk/lib-dynamodb";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { QueryString } from "aws-cdk-lib/aws-logs";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {  
    try {
     // Print Event
     console.log("Event: ", event);
     const parameters  = event?.pathParameters;
     const movieId = parameters?.movieId;
     const username = parameters?.type;
     const language = event?.queryStringParameters?.language;


    //  return {
    //     statusCode: 200,
    //     headers: {
    //         "content-type": "application/json",
    //     },
    //     body: JSON.stringify({ parameters, movieId, username, language }),
    //  }

    if(!movieId){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No movie id" }),
      };
    }

    if(!username){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No username" }),
      };
    }


    if(!language){
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "No language" }),
      };
    }

    const input: QueryCommandInput = {
        TableName   : "Reviews",
        KeyConditionExpression: "movieId = :movieId and username = :username",
        ExpressionAttributeValues: {
            ":movieId": Number(movieId),
            ":username": username
        },
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
        username: username,
        language: language.toUpperCase()
    };

    const translate = await translateText(commandOutput.Items[0].review, language);
    body.data[0].review = translate;


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


      async function translateText(text: string, language: string) {    
        const translateClient = new TranslateClient({ region: process.env.REGION });
        const translate =   {
            Text: text,
            SourceLanguageCode: "en",
            TargetLanguageCode: language,
        };
        const translateCommand = new TranslateTextCommand(translate);
        const translateOutput = await translateClient.send(translateCommand);
        return translateOutput.TranslatedText;

    }

