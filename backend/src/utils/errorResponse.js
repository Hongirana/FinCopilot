
const errorResponse = {
  "success": false,
  "error": {
    "message": "Validation failed",
    "statusCode": 400,
    "errors": [
      { "field": "email", "message": "Invalid email format" },
      { "field": "password", "message": "Password too weak" }
    ]
  }
}

module.exports = errorResponse;