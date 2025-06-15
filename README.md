# 🧾 Personal Finance Assistant

A Django-based web app that helps you upload and analyze your personal credit card and bank transactions. It unifies multiple statement formats into a single system and uses AI to automatically categorize your expenses (e.g., food, travel, housing).

---

## 🚀 Features

- Upload Excel files (bank/credit card statements)
- Automatically parse and normalize transactions
- Categorize expenses using AI (coming soon)
- View summary statistics and insights

---

## 🛠 Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finance-assistant.git
cd finance-assistant
```

### 2. Create a Virtual Environment

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Apply Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (optional)

```bash
python manage.py createsuperuser
```

### 6. Run the Development Server

```bash
python manage.py runserver
```

Visit [http://127.0.0.1:8000](http://127.0.0.1:8000) to start using the app.

---

## 🧪 Run Tests

```bash
python manage.py test
```

---

## 📂 Project Structure

```text
juiko/
├── finance_assistant/       # Django project settings
├── transactions/            # Main app (models, views, etc.)
├── manage.py
├── requirements.txt
└── README.md
```

---

## 🔮 Coming Soon

- AI-based transaction categorization
- Dashboard with spending insights
- CSV support
- Multi-user login

---

## 👥 Contributing

Feel free to fork the repo, open issues, or submit pull requests. Contributions are welcome!

---

## 📝 License

MIT License (or your preferred license)
