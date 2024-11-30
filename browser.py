from flask import Flask, jsonify, request
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import datetime
from flask_cors import CORS
from bson import ObjectId


# Load environment variables from .env file
load_dotenv()

# Create Flask app
app = Flask(__name__)

CORS(app)
# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI')
if not MONGODB_URI:
    raise ValueError("MONGODB_URI is not set in the .env file")

client = MongoClient(MONGODB_URI)
db = client.test
reviews_collection = db.reviews
@app.route('/api/items', methods=['GET'])
def get_items():
    try:
        items = db.items.aggregate([
            {
                '$lookup': {
                    'from': 'users',  # Match 'users' collection
                    'localField': 'ownerId',  # Match using 'ownerId' in 'items'
                    'foreignField': '_id',  # '_id' field in 'users'
                    'as': 'owner'  # Store the result in 'owner'
                }
            },
            {
                '$unwind': { 
                    'path': '$owner', 
                    'preserveNullAndEmptyArrays': True  # Handle cases where no matching owner exists
                }
            },
            {
                '$project': {  # Ensure the necessary fields are included in the response
                    '_id': 1,
                    'name': 1,
                    'age': 1,
                    'owner.name': 1,  # Include owner's name
                    'location': 1,
                    'description': 1,
                    'price': 1,
                    'pricePer': 1,
                    'ownerId': 1  # Include original `ownerId`
                }
            }
        ])
        
        # Format the result as a JSON list
        items_data = [{
            'id': str(item['_id']),
            'name': item.get('name', 'N/A'),
            'age': item.get('age', 'N/A'),
            'owner': item['owner'].get('name', 'Unknown') if item['owner'] else 'Unknown',  # Get owner's name
            'ownerId': str(item.get('ownerId', '')),
            'location': item.get('location', 'N/A'),
            'description': item.get('description', 'N/A'),
            'price': item.get('price', 'N/A'),
            'pricePer': item.get('pricePer', 'N/A'),
        } for item in items]
        
        return jsonify(items_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rentals/request', methods=['POST'])
def request_rental():
    try:
        data = request.get_json()
        print(f"Received rental request: {data}")  # Log the incoming data
        
        # Validate required fields
        required_fields = ['itemId', 'renterId', 'ownerId', 'rentalPeriod', 'message']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f"Missing or invalid field: {field}"}), 400
        
        # Create the rental request object
        rental_request = {
            'itemId': data['itemId'],
            'renterId': data['renterId'],
            'ownerId': data['ownerId'],
            'rentalPeriod': data['rentalPeriod'],
            'message': data['message'],
            'status': 'pending',
            'createdAt': datetime.datetime.utcnow()
        }

        db.rentals.insert_one(rental_request)

        return jsonify({'message': 'Rental request submitted successfully'})
    except Exception as e:
        print(f"Error in request_rental: {e}")  # Log the error
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/user/<user_id>', methods=['GET'])
def get_user(user_id):
    print(f"Fetching user with ID: {user_id}")
    """
    Fetch user details by user ID.
    """
    try:
        from bson import ObjectId
        if not ObjectId.is_valid(user_id):
            print(f"Invalid ObjectId format: {user_id}")
            return jsonify({'error': 'Invalid user ID format'}), 400

        user = db.users.find_one({'_id': ObjectId(user_id)}, {'name': 1})
        if not user:
            print(f"No user found for ID: {user_id}")
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'name': user['name']})
    except Exception as e:
        print(f"Error fetching user details: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    

@app.route('/api/rentals/requests', methods=['GET'])
def get_rental_requests():
    try:
        user_id = request.cookies.get('userId')
        if not user_id or not ObjectId.is_valid(user_id):
            return jsonify({'error': 'User not logged in or invalid userId'}), 401
        rental_requests = db.rentals.aggregate([
            {'$match': {'ownerId': ObjectId(user_id)}},
            {
                '$lookup': {
                    'from': 'items',
                    'localField': 'itemId',
                    'foreignField': '_id',
                    'as': 'item'
                }
            },
            {'$unwind': '$item'},
            {
                '$project': {
                    'id': {'$toString': '$_id'},
                    'itemId': {'$toString': '$item._id'},
                    'itemName': '$item.name',
                    'itemPrice': '$item.price',
                    'rentalPeriod': 1,
                    'location': '$item.location',
                    'date': '$createdAt',
                    'status': 1
                }
            }
        ])
        return jsonify({'requests': list(rental_requests)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/rental-requests/<request_id>', methods=['PUT'])
def update_rental_request(request_id):
    try:
        if not ObjectId.is_valid(request_id):
            return jsonify({'error': 'Invalid request ID'}), 400
        data = request.get_json()
        status = data.get('status')
        if status not in ['approved', 'declined']:
            return jsonify({'error': 'Invalid status value'}), 400
        result = db.rentals.update_one(
            {'_id': ObjectId(request_id)},
            {'$set': {'status': status}}
        )
        if result.modified_count == 0:
            return jsonify({'error': 'Request not found or status already set'}), 404
        return jsonify({'message': f'Request {status} successfully.'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
@app.route('/api/review/submit', methods=['POST'])
def submit_review():
    try:
        # Parse JSON data from request
        data = request.get_json()
        print(f"Received data: {data}")

        # Extract the fields from the received data
        item_id = data.get('item_id')
        rating = data.get('rating')
        comment = data.get('comment')

        # Validate the data
        if not item_id or not rating or not comment:
            return jsonify({'error': 'Missing required fields'}), 400

        # Insert the review into the database
        review = {
            'itemId': ObjectId(item_id),  # Ensure ObjectId format for MongoDB
            'rating': rating,
            'comment': comment,
            'created_at': datetime.datetime.utcnow()  # Timestamp for the review
        }
        reviews_collection.insert_one(review)

        # Return success response
        return jsonify({'message': 'Review submitted successfully!'}), 200

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': 'Failed to submit review'}), 500
@app.route('/api/review/<item_id>', methods=['GET'])
def get_reviews(item_id):
    try:
        # Validate the ObjectId
        if not ObjectId.is_valid(item_id):
            return jsonify({'error': 'Invalid item ID'}), 400

        # Fetch reviews for the item
        reviews = reviews_collection.find({'itemId': ObjectId(item_id)})
        review_list = [{
            'rating': review['rating'],
            'comment': review['comment']
        } for review in reviews]

        return jsonify(review_list), 200
    except Exception as e:
        print(f"Error fetching reviews: {e}")
        return jsonify({'error': 'Failed to fetch reviews'}), 500

@app.route('/api/chat/message', methods=['POST'])
def save_chat_message():
    try:
        data = request.get_json()
        room_id = data.get('roomId')
        sender_id = data.get('senderId')
        message = data.get('message')

        if not room_id or not sender_id or not message:
            return jsonify({'error': 'Missing required fields'}), 400

        chat_message = {
            'roomId': room_id,
            'senderId': ObjectId(sender_id),
            'message': message,
            'timestamp': datetime.datetime.utcnow()
        }
        db.chats.insert_one(chat_message)

        return jsonify({'message': 'Message saved successfully'}), 200
    except Exception as e:
        print(f"Error saving chat message: {e}")
        return jsonify({'error': 'Failed to save message'}), 500

@app.route('/api/chat/<room_id>', methods=['GET'])
def fetch_chat_history(room_id):
    try:
        messages = db.chat_messages.find({'roomId': room_id}).sort('timestamp', 1)
        message_list = [
            {
                'message': message['message'],
                'senderId': str(message['senderId']),
                'senderName': db.users.find_one({'_id': message['senderId']}).get('name', 'Unknown'),
                'timestamp': message['timestamp'].isoformat()
            }
            for message in messages
        ]
        return jsonify(message_list), 200
    except Exception as e:
        print(f"Error fetching chat history: {e}")
        return jsonify({'error': 'Failed to fetch chat history'}), 500

if __name__ == '__main__':
    app.run(debug=True)
