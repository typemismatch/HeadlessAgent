# Display our RAT number

import sys, sense_hat, json

sense = sense_hat.SenseHat()

def displayRat():
    # The file must be opened each time as it might change
    with open("/home/agent/HeadlessAgent/device.config.json") as data_file:
        data = json.load(data_file)
        sense.show_message(data["thingName"])


def main_loop():
    sense.clear()
    while True:
        displayRat()
        for event in sense.stick.get_events():
            print (event.action)
            if event.action == "released":
                sense.clear()
                raise SystemExit(0)


if __name__ == '__main__':
    main_loop()
