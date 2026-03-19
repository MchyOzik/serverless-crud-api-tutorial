import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  UpdateCommand,
  PutCommand,
  DynamoDBDocumentClient,
  ScanCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    let response;

    switch (event.httpMethod) {
      case "GET":
        response = await handleGetRequest();
        break;
      case "POST":
        response = await handlePostRequest(event);
        break;
      case "PATCH":
        response = await handlePatchRequest(event);
        break;
      case "DELETE":
        response = await handleDeleteRequest(event);
        break;
      default:
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: "Invalid request type" }),
        };
    }

    return response;

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error",
        error: error.message,
      }),
    };
  }
};

// GET
const handleGetRequest = async () => {
  const command = new ScanCommand({
    TableName: "tasks",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(response.Items),
  };
};

// POST
const handlePostRequest = async (event) => {
  const { name, completed } = JSON.parse(event.body);

  const command = new PutCommand({
    TableName: "tasks",
    Item: {
      id: Date.now().toString(),
      name,
      completed,
    },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Task created" }),
  };
};

// PATCH
const handlePatchRequest = async (event) => {
  const { id, name, completed } = JSON.parse(event.body);

  const command = new UpdateCommand({
    TableName: "tasks",
    Key: { id },
    UpdateExpression: "set #n = :n, completed = :c",
    ExpressionAttributeNames: {
      "#n": "name",
    },
    ExpressionAttributeValues: {
      ":n": name,
      ":c": completed,
    },
    ReturnValues: "ALL_NEW",
  });

  const response = await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify(response.Attributes),
  };
};

// DELETE
const handleDeleteRequest = async (event) => {
  const { id } = JSON.parse(event.body);

  const command = new DeleteCommand({
    TableName: "tasks",
    Key: { id },
  });

  await docClient.send(command);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Deleted" }),
  };
};
