type JsonPrimitive = string | number | boolean | null;
type JsonObject = {
  [key in string]?: JsonValue;
};
type JsonArray = JsonValue[];
type JsonValue = JsonPrimitive | JsonObject | JsonArray;
