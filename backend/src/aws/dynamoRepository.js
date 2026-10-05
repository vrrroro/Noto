import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const isConditionFailure = (err) => err?.name === 'ConditionalCheckFailedException';

/**
 * Repository for one DynamoDB table whose key is (userId, <idKey>).
 * Because userId is the partition key, every read/write is automatically
 * scoped to one user: there is no way to look up an item without its owner.
 */
export function createDynamoRepository(doc, tableName, idKey) {
  const key = (userId, id) => ({ userId, [idKey]: id });

  return {
    async list(userId) {
      const items = [];
      let ExclusiveStartKey;
      do {
        const page = await doc.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: 'userId = :u',
            ExpressionAttributeValues: { ':u': userId },
            ExclusiveStartKey,
          }),
        );
        items.push(...(page.Items ?? []));
        ExclusiveStartKey = page.LastEvaluatedKey;
      } while (ExclusiveStartKey);
      return items;
    },

    async get(userId, id) {
      const result = await doc.send(new GetCommand({ TableName: tableName, Key: key(userId, id) }));
      return result.Item ?? null;
    },

    async create(item) {
      await doc.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
          ConditionExpression: 'attribute_not_exists(#id)',
          ExpressionAttributeNames: { '#id': idKey },
        }),
      );
      return item;
    },

    // Returns the updated item, or null if it does not exist for this user.
    async update(userId, id, changes, { remove = [] } = {}) {
      const names = { '#id': idKey };
      const values = {};
      const sets = Object.entries(changes).map(([field, value], i) => {
        names[`#f${i}`] = field;
        values[`:v${i}`] = value;
        return `#f${i} = :v${i}`;
      });
      const removes = remove.map((field, i) => {
        names[`#r${i}`] = field;
        return `#r${i}`;
      });

      let UpdateExpression = '';
      if (sets.length) UpdateExpression += `SET ${sets.join(', ')}`;
      if (removes.length) UpdateExpression += ` REMOVE ${removes.join(', ')}`;

      try {
        const result = await doc.send(
          new UpdateCommand({
            TableName: tableName,
            Key: key(userId, id),
            UpdateExpression: UpdateExpression.trim(),
            ConditionExpression: 'attribute_exists(#id)',
            ExpressionAttributeNames: names,
            ExpressionAttributeValues: Object.keys(values).length ? values : undefined,
            ReturnValues: 'ALL_NEW',
          }),
        );
        return result.Attributes;
      } catch (err) {
        if (isConditionFailure(err)) return null;
        throw err;
      }
    },

    // Returns false if the item did not exist for this user.
    async remove(userId, id) {
      try {
        await doc.send(
          new DeleteCommand({
            TableName: tableName,
            Key: key(userId, id),
            ConditionExpression: 'attribute_exists(#id)',
            ExpressionAttributeNames: { '#id': idKey },
          }),
        );
        return true;
      } catch (err) {
        if (isConditionFailure(err)) return false;
        throw err;
      }
    },
  };
}
