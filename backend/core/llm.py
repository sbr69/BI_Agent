"""
Groq LLM Client — handles API calls and structured JSON parsing.
Uses Llama 3.3 70B via Groq for fast inference.
"""

import json
import os
import re
from groq import Groq


class GroqClient:
    """Wrapper for Groq API with structured output parsing."""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found. Set it in your .env file.\n"
                "Get a free key at: https://console.groq.com/"
            )
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    def generate(self, system_prompt: str, user_prompt: str) -> dict:
        """
        Send prompt to Groq and parse the structured JSON response.
        Returns parsed dict with sql_queries, charts, insights, error.
        """
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1,
                max_completion_tokens=4096,
                top_p=1,
                stream=False,
            )

            content = response.choices[0].message.content
            if not content:
                return {
                    "sql_queries": [],
                    "charts": [],
                    "insights": [],
                    "error": "LLM returned an empty response. Please try rephrasing your question."
                }
            raw_text = content.strip()

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

        # Try to find JSON object in the text (non-greedy to avoid matching garbage)
        match = re.search(r'\{[\s\S]*?\}(?=[^}]*$)', text)
        if not match:
            match = re.search(r'\{[\s\S]*\}', text)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass

        raise json.JSONDecodeError("No valid JSON found", text, 0)

    def _validate_response(self, data: dict) -> dict:
        """Validate and normalize the LLM response structure."""
        result = {
            "sql_queries": data.get("sql_queries", []),
            "charts": data.get("charts", []),
            "kpis": data.get("kpis", []),
            "insights": data.get("insights", []),
            "error": data.get("error", None)
        }

        # Validate each chart has required fields
        valid_chart_types = {"bar", "line", "pie", "area", "scatter", "table"}
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
                    "colorScheme": chart.get("colorScheme", "default"),
                    "highlights": [
                        h for h in chart.get("highlights", [])
                        if isinstance(h, dict) and h.get("value") is not None
                    ],
                })
        result["charts"] = validated_charts

        # Validate KPIs — accept both:
        #   (a) dynamic pattern: label + sql_index + valueKey  (LLM-preferred)
        #   (b) static  pattern: label + value                 (fallback)
        validated_kpis = []
        for kpi in result["kpis"]:
            if not isinstance(kpi, dict) or not kpi.get("label"):
                continue
            has_dynamic = kpi.get("sql_index") is not None and kpi.get("valueKey")
            has_static = kpi.get("value") is not None
            if not (has_dynamic or has_static):
                continue
            validated_kpis.append({
                "label": str(kpi["label"]),
                # Keep value as None when using dynamic pattern so routes.py
                # computes it from the SQL result
                "value": str(kpi["value"]) if has_static else None,
                "sql_index": kpi.get("sql_index"),
                "valueKey": kpi.get("valueKey"),
                "prefix": kpi.get("prefix", ""),
                "change": kpi.get("change"),
                "trend": kpi.get("trend", "neutral"),
            })
        result["kpis"] = validated_kpis

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
_client: GroqClient | None = None


def get_llm_client() -> GroqClient:
    """Get or create the Groq client singleton."""
    global _client
    if _client is None:
        _client = GroqClient()
    return _client
