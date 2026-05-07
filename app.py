import os
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

app = Flask(__name__)

# Configure SQLite database to save in the persistent volume
db_path = os.path.join(os.path.dirname(__file__), 'data', 'budget.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Model
class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    type = db.Column(db.String(10), nullable=False) # 'income' or 'expense'
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    description = db.Column(db.String(200))

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.strftime('%Y-%m-%d'),
            'type': self.type,
            'amount': self.amount,
            'category': self.category,
            'description': self.description
        }

# Initialize Database
with app.app_context():
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    db.create_all()

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    transactions = Transaction.query.order_by(Transaction.date.desc()).all()
    return jsonify([t.to_dict() for t in transactions])

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    data = request.json
    try:
        new_tx = Transaction(
            type=data['type'],
            amount=float(data['amount']),
            category=data['category'],
            description=data.get('description', ''),
            date=datetime.strptime(data['date'], '%Y-%m-%d') if data.get('date') else datetime.utcnow()
        )
        db.session.add(new_tx)
        db.session.commit()
        return jsonify(new_tx.to_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
def delete_transaction(id):
    tx = Transaction.query.get_or_404(id)
    db.session.delete(tx)
    db.session.commit()
    return '', 204

@app.route('/api/summary', methods=['GET'])
def get_summary():
    transactions = Transaction.query.all()
    income = sum(t.amount for t in transactions if t.type == 'income')
    expense = sum(t.amount for t in transactions if t.type == 'expense')
    return jsonify({
        'total_income': income,
        'total_expense': expense,
        'balance': income - expense
    })

if __name__ == '__main__':
    app.run(debug=True)