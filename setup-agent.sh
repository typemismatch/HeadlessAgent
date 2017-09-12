#!/bin/sh

npm install

systemctl enable /home/agent/HeadlessAgent/ratchet-agent.service
systemctl start ratchet-agent.service

systemctl enable /home/agent/HeadlessAgent/ratchet-display.service
systemctl start ratchet-display.service