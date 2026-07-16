from Application import app
from flask import request, jsonify
from mongoengine.errors import NotUniqueError
from ..database.models import Device, Schedule
import json

@app.route('/schedules', methods=['POST'])
def add_schedule():
    try:
        data = request.get_json()
        device_id = data.get('deviceId')

        existing = Schedule.objects(deviceId=device_id).first()

        if existing:
            existing.powerOnTime = data.get('powerOnTime', existing.powerOnTime)
            existing.powerOffTime = data.get('powerOffTime', existing.powerOffTime)
            existing.recurrence = data.get('recurrence', existing.recurrence)
            existing.startDate = data.get('startDate', existing.startDate)
            existing.consumptionPerHour = data.get('consumptionPerHour', existing.consumptionPerHour)
            existing.save()
            return jsonify({'message': 'Schedule updated successfully'}), 200
        else:
            new_schedule = Schedule(**data)
            new_schedule.save()
            return jsonify({'message': 'Schedule added successfully'}), 201
    except NotUniqueError:
        existing = Schedule.objects(deviceId=device_id).first()
        if existing:
            existing.powerOnTime = data.get('powerOnTime', existing.powerOnTime)
            existing.powerOffTime = data.get('powerOffTime', existing.powerOffTime)
            existing.recurrence = data.get('recurrence', existing.recurrence)
            existing.startDate = data.get('startDate', existing.startDate)
            existing.consumptionPerHour = data.get('consumptionPerHour', existing.consumptionPerHour)
            existing.save()
            return jsonify({'message': 'Schedule updated successfully'}), 200
        return jsonify({'error': 'Failed to save schedule'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 400  


@app.route('/schedules', methods=['GET'])
def get_all_schedules():
    try:
        schedules = Schedule.objects()
        return jsonify(json.loads(schedules.to_json())), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedules/<deviceId>', methods=['GET'])
def get_schedules(deviceId):
    try:
        device = Device.objects.get(id=deviceId)
        schedules = Schedule.objects(deviceId=device.id)
        return jsonify(json.loads(schedules.to_json())), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


@app.route('/schedules/<scheduleId>', methods=['DELETE'])
def delete_schedule(scheduleId):
    try:
        Schedule.objects(id=scheduleId).delete()
        return jsonify({'message': 'Schedule deleted'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500