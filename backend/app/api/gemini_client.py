# backend/app/api/gemini_client.py

import os
from google import genai

api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

def call_gemini(prompt: str) -> str:
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return response.text if response and response.text else ""

    except Exception as e:
        print(f"Gemini Error: {e}")
        return ""

def summarize_results(question: str, results: list[dict]) -> str:
    """
    Given the original question + model results,
    ask Gemini for a short conversational answer.
    """

    if not results:
        return "I couldn’t find sufficient data to answer that query."

    # Format results for Gemini
    neighborhoods = [
        f"{r.get('name')} (score: {r.get(list(r.keys())[-2])}, grade: {r.get('nsqi_grade')})"
        for r in results
    ]
    formatted = "\n".join(neighborhoods)

    prompt = f"""
Respond conversationally to the user question.

User question:
{question}

Data:
{formatted}

Guidelines:
- Make it concise, friendly, and helpful.
- Explain what the ranking means in plain English.
- Don't include raw numbers, unless necessary.
- Do NOT output JSON.
    """

    try:
        text = call_gemini(prompt)
        return text.strip()
    except Exception as e:
        print("Summarization error:", e)
        return "Here are the neighborhoods you asked about."
