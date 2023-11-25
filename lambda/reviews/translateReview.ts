import { Handler } from "aws-lambda";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommandOutput, QueryCommand, QueryCommandInput } from "@aws-sdk/lib-dynamodb";
import { TranslateClient, ListLanguagesCommand, TranslateTextCommand } from "@aws-sdk/client-translate";


import { APIGatewayProxyHandlerV2 } from "aws-lambda";

const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {

    try {

        const parameters = event?.pathParameters;
        const movieId = parameters?.movieId;
        const username = parameters?.username;
        const language = event?.queryStringParameters?.language;

        if (!movieId || !username || !language) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "No movie Id or username or language" }),
            };
        }

        const querycommand: QueryCommandInput = {
            TableName: "Reviews",
            KeyConditionExpression: "movieId = :movieId and username = :username",
            ExpressionAttributeValues: {
                ":movieId": Number(movieId),
                ":username": username
            }

        }

        const commandOutput = await ddbDocClient.send(
            new QueryCommand(querycommand)
        );

        if (!commandOutput.Items) {
            return {
                statusCode: 404,
                headers: {
                    "content-type": "application/json",
                },
                body: JSON.stringify({ Message: "Invalid movie Id or username" }),
            };
        }

        let body = {
            data: commandOutput.Items,
            id: movieId,
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

async function translateText(text: string, language: string) {
    const translateClient = new TranslateClient({ region: process.env.REGION });
    const  translate ={
        SourceLanguageCode: "en",
        TargetLanguageCode: language,
        Text: text
    };

    const translateCommand = new TranslateTextCommand(translate);
    const translateOutput = await translateClient.send(translateCommand);
    return translateOutput.TranslatedText;
}


    
