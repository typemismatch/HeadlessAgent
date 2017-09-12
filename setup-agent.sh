#!/bin/sh

npm install
systemctl enable /home/agent/HeadlessAgent/ratchet-agent.service
systemctl start ratchet-agent.service
