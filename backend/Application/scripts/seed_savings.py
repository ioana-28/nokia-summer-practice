from datetime import datetime, timedelta
from random import uniform
from Application.database.models import Device, Schedule, Saving, DailySaving


def seed_savings(days=7):
    devices = Device.objects()
    today = datetime.now()

    for device in devices:
        schedule = Schedule.objects(deviceId=device.id).first()
        consumption = schedule.consumptionPerHour if schedule and schedule.consumptionPerHour else None

        savings_log = []
        for i in range(days):
            day = today - timedelta(days=i)
            hours_off = round(uniform(4, 12), 1)
            if consumption:
                energy_saved = round(hours_off * consumption, 2)
            else:
                energy_saved = round(uniform(1, 5), 2)

            savings_log.append(DailySaving(
                date=day.strftime('%Y-%m-%d'),
                hoursOff=hours_off,
                energySaved=energy_saved
            ))

        Saving.objects(deviceName=device.deviceName).update_one(
            upsert=True,
            set__log=savings_log
        )
        label = f"{device.deviceName} ({consumption} kWh/h)" if consumption else device.deviceName
        print(f"Seeded {days} day(s) for {label}")

    print(f"Done. Seeded {len(devices)} device(s).")


if __name__ == '__main__':
    from Application import app
    with app.app_context():
        seed_savings()
