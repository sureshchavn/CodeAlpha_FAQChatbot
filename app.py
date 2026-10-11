
from flask import Flask, render_template, request, jsonify # type: ignore
from pathlib import Path
from collections import Counter
import json
import math
import re

app = Flask(__name__)

FAQ_FILE = Path(__file__).parent / "faqs.json"
SIMILARITY_THRESHOLD = 0.18


def tokenize(text):
    """Normalize text and extract searchable words."""
    return re.findall(r"[a-z0-9]+", text.lower())


def load_faqs():
    with FAQ_FILE.open("r", encoding="utf-8") as file:
        data = json.load(file)

    if not isinstance(data, list) or not data:
        raise ValueError("faqs.json must contain a non-empty list.")

    for faq in data:
        if not faq.get("question") or not faq.get("answer"):
            raise ValueError("Every FAQ needs a question and an answer.")

    return data


faqs = load_faqs()


def build_document_vectors(documents):
    """Create TF-IDF vectors using Python's standard library."""
    tokenized = [tokenize(document) for document in documents]
    document_frequency = Counter()

    for tokens in tokenized:
        document_frequency.update(set(tokens))

    total_documents = len(documents)
    vectors = []

    for tokens in tokenized:
        counts = Counter(tokens)
        vector = {}

        for word, count in counts.items():
            tf = count / len(tokens) if tokens else 0
            idf = math.log(
                (1 + total_documents) /
                (1 + document_frequency[word])
            ) + 1
            vector[word] = tf * idf

        vectors.append(vector)

    return vectors, document_frequency, total_documents


questions = [faq["question"] for faq in faqs]
question_vectors, document_frequency, total_documents = (
    build_document_vectors(questions)
)


def vectorize_query(text):
    tokens = tokenize(text)
    counts = Counter(tokens)
    vector = {}

    if not tokens:
        return vector

    for word, count in counts.items():
        tf = count / len(tokens)
        idf = math.log(
            (1 + total_documents) /
            (1 + document_frequency.get(word, 0))
        ) + 1
        vector[word] = tf * idf

    return vector


def cosine_similarity(first, second):
    dot_product = sum(
        value * second.get(word, 0)
        for word, value in first.items()
    )

    first_norm = math.sqrt(sum(value * value for value in first.values()))
    second_norm = math.sqrt(sum(value * value for value in second.values()))

    if first_norm == 0 or second_norm == 0:
        return 0.0

    return dot_product / (first_norm * second_norm)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "FAQ Chatbot",
        "faq_count": len(faqs)
    })


@app.route("/api/faqs")
def get_faqs():
    return jsonify({
        "faqs": [
            {
                "question": faq["question"],
                "category": faq.get("category", "General")
            }
            for faq in faqs
        ]
    })


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "")

    if not isinstance(message, str):
        return jsonify({"error": "Message must be text."}), 400

    message = message.strip()

    if not message:
        return jsonify({"error": "Please enter a question."}), 400

    if len(message) > 500:
        return jsonify({
            "error": "Maximum message length is 500 characters."
        }), 400

    query_vector = vectorize_query(message)

    scores = [
        cosine_similarity(query_vector, vector)
        for vector in question_vectors
    ]

    best_index = max(range(len(scores)), key=scores.__getitem__)
    best_score = scores[best_index]

    if best_score < SIMILARITY_THRESHOLD:
        return jsonify({
            "answer": (
                "Sorry, I couldn't find a reliable answer to that question. "
                "Try rephrasing it or choose one of the suggested questions."
            ),
            "matchedQuestion": None,
            "confidence": round(best_score * 100, 2),
            "found": False
        })

    matched_faq = faqs[best_index]

    return jsonify({
        "answer": matched_faq["answer"],
        "matchedQuestion": matched_faq["question"],
        "category": matched_faq.get("category", "General"),
        "confidence": round(best_score * 100, 2),
        "found": True
    })


if __name__ == "__main__":
    app.run(debug=True)
