#!/bin/sh

systemctl enable /home/agent/HeadlessAgent/ratchet-agent.service
systemctl start ratchet-agent.service
