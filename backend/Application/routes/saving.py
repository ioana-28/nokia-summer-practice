from Application import app
from flask import request, jsonify
from ..database.models import Saving
from collections import defaultdict
from datetime import datetime, timedelta


@app.route('/savings/summary', methods=['GET'])
def savings_summary():
    try:
        days = request.args.get('days', 7, type=int)
        cutoff = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

        all_savings = Saving.objects()
        by_date = defaultdict(float)

        for s in all_savings:
            for entry in s.log:
                if entry.date >= cutoff:
                    by_date[entry.date] += entry.energySaved

        result = [{'date': d, 'totalSaved': round(v, 2)} for d, v in sorted(by_date.items())]
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
