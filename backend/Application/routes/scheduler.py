from Application import app
from flask import request, jsonify
from ..database.models import Device, Schedule
import json

@app.route('/schedules', methods=['POST'])
def add_schedule():
    try:
        data = request.get_json()
        new_schedule = Schedule(**data)
        new_schedule.save()
        return jsonify({'message': 'Schedule added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400  


@app.route('/schedules/<deviceId>', methods=['GET'])
def get_schedules(deviceId):
    try:
        device = Device.objects.get(id=deviceId)
        schedules = Schedule.objects(deviceId=device.id)
        return jsonify(json.loads(schedules.to_json())), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500