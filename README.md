# CodeAlpha FAQ Chatbot

A lightweight FAQ Chatbot built using Python, Flask, HTML, CSS, and JavaScript. It matches user questions with predefined FAQs and displays relevant answers through an interactive chat interface.

## Features

- FAQ matching using a pure Python TF-IDF-style similarity approach
- Interactive chatbot interface
- Animated thinking indicator
- Typing animation for chatbot responses
- Quick question suggestions
- Dark and light themes
- New chat functionality
- Responsive user interface
- REST API endpoints
- FAQ data stored in JSON format

## Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Python, Flask
- **Data Storage:** JSON
- **Version Control:** Git and GitHub

## Project Structure

```text
CodeAlpha_FAQChatbot/
├── app.py
├── faqs.json
├── requirements.txt
├── README.md
├── .gitignore
├── templates/
│   └── index.html
└── static/
    ├── style.css
    └── script.js
```

## Installation and Setup

### 1. Clone the Repository

```powershell
git clone https://github.com/YOUR_USERNAME/CodeAlpha_FAQChatbot.git
cd CodeAlpha_FAQChatbot
```

Replace `YOUR_USERNAME` with your GitHub username.

### 2. Create a Virtual Environment

```powershell
python -m venv .venv
```

### 3. Activate the Virtual Environment

```powershell
.\.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 5. Run the Application

```powershell
python app.py
```

Open the local URL displayed in the terminal, usually:

`http://127.0.0.1:5000`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Displays the chatbot interface |
| GET | `/api/health` | Checks API health |
| GET | `/api/faqs` | Returns FAQ data |
| POST | `/api/chat` | Accepts a question and returns a response |

## How It Works

1. The user enters a question in the chat interface.
2. The frontend sends the question to the Flask backend.
3. The backend compares the question with predefined FAQs using text similarity.
4. The best matching FAQ is selected based on the implementation's matching logic.
5. The response is returned to the frontend and displayed in the chat.

## Limitations

- Responses are limited to the predefined FAQ dataset.
- Answer quality depends on the similarity-matching logic and available FAQ entries.
- The chatbot does not generate unrestricted answers like a large language model.

## Future Enhancements

- Add more FAQs and categories.
- Improve question matching and confidence handling.
- Add multilingual support.
- Integrate an advanced NLP model if required.

## Disclaimer

This project is developed for educational purposes as part of the CodeAlpha internship.

## Author

**Suresh Chavan**

GitHub: [@sureshchavn](https://github.com/sureshchavn)

LinkedIn: [Connect on LinkedIn](https://www.linkedin.com/in/suresh-chavan/)