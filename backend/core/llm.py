"""
Gemini LLM Client — handles API calls and structured JSON parsing.
"""

import json
import os
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()


class GeminiClient:
    """Wrapper for Google Gemini API with structured output parsing."""

    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY not found. Set it in your .env file.\n"
                "Get a free key at: https://aistudio.google.com/"
            )
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    def generate(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Send prompt to Gemini and parse the structured JSON response.
        Returns parsed dict with sql_queries, charts, insights, error.
        """
        try:
            response = self.model.generate_content(
                [
                    {"role": "user", "parts": [{"text": system_prompt + "\n\nUser Question: " + user_prompt}]}
                ],
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for accuracy
                    max_output_tokens=4096,
                ),
            )

            raw_text = response.text.strip()

            # Try to parse JSON from the response
            parsed = self._extract_json(raw_text)

            # Validate the structure
            return self._validate_response(parsed)

        except json.JSONDecodeError as e:
            return {
                "sql_queries": [],
                "charts": [],
                "insights": [],
                "error": f"Failed to parse LLM response as JSON: {str(e)}"
            }
        except Exception as e:
            return {
                "sql_queries": [],
                "charts": [],
                "insights": [],
                "error": f"LLM error: {str(e)}"
            }

    def _extract_json(self, text: str) -> dict:
        """Extract JSON from LLM response, handling markdown code blocks."""
        # Remove markdown code blocks if present
        text = re.sub(r"^```(?:json)?\s*\n?", "", text)
        text = re.sub(r"\n?```\s*$", "", text)
        text = text.strip()

        # Try direct parse
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # Try to find JSON object in the text
        match = re.search(r'\{[\s\S]*\}', text)
        if match:
            return json.loads(match.group())

        raise json.JSONDecodeError("No valid JSON found", text, 0)

    def _validate_response(self, data: dict) -> dict:
        """Validate and normalize the LLM response structure."""
        result = {
            "sql_queries": data.get("sql_queries", []),
            "charts": data.get("charts", []),
            "insights": data.get("insights", []),
            "error": data.get("error", None)
        }

        # Validate each chart has required fields
        valid_chart_types = {"bar", "line", "pie", "area", "scatter"}
        validated_charts = []
        for chart in result["charts"]:
            if isinstance(chart, dict) and chart.get("type") in valid_chart_types:
                validated_charts.append({
                    "type": chart["type"],
                    "title": chart.get("title", "Chart"),
                    "description": chart.get("description", ""),
                    "sql_index": chart.get("sql_index", 0),
                    "xKey": chart.get("xKey", ""),
                    "yKeys": chart.get("yKeys", []),
                    "groupBy": chart.get("groupBy", None),
                    "colorScheme": chart.get("colorScheme", "default")
                })
        result["charts"] = validated_charts

        # Validate SQL queries
        valid_queries = []
        for q in result["sql_queries"]:
            if isinstance(q, dict) and q.get("sql"):
                valid_queries.append({
                    "sql": q["sql"],
                    "purpose": q.get("purpose", "")
                })
        result["sql_queries"] = valid_queries

        return result


# Singleton — initialized lazily
_client: GeminiClient | None = None


def get_gemini_client() -> GeminiClient:
    """Get or create the Gemini client singleton."""
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
