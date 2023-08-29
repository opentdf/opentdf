import React, { useState } from "react";
import Drawer from '@mui/material/Drawer';
import { Timeline,
  TimelineItem,
  TimelineContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { LockOpen, LockPerson, Lock, RemoveCircle } from '@mui/icons-material';

const parseTime = (timestamp) => {
  const date = new Date(timestamp);
  const formattedDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')} (UTC)`;

  return formattedDate;
}

const iconMap = {
  'read': {
    icon: (
      <TimelineDot color="info">
        <LockOpen sx={{ color: 'white' }} />
      </TimelineDot>
    ),
    text: (event) => `Decrypted "${event.object.id}" by ${event.actor.id}`
  },
  'create': {
    icon: (
      <TimelineDot color="primary">
        <LockPerson sx={{ color: 'white' }} />
      </TimelineDot>
    ),
    text: (event) => `Encrypted "${event.object.id}" by ${event.owner.id}`
  },
  'delete': {
    icon: (
      <TimelineDot color="error">
        <RemoveCircle sx={{ color: 'white' }} />
      </TimelineDot>
    ),
    text: (event) => `Removed "${event.object.id}" task by ${event.actor.id}`
  },
  'update': {
    icon: (
      <TimelineDot color="warning">
        <RemoveCircle sx={{ color: 'white' }} />
      </TimelineDot>
    ),
    text: (event) => <>{event.diff.message} by {event.actor.id}</>
  }
}

export default ({ showAudit, setShowAudit, events }) => {
  return (
    <Drawer
      anchor={'left'}
      open={showAudit}
      onClose={() => setShowAudit(false)}
    >
      <h3 style={{ textAlign: 'center', margin: 0, minWidth: '500px' }}>Audit</h3>
      <Timeline position="alternate">
        {
          events.map((event) => (
            <TimelineItem>
              <TimelineOppositeContent
                sx={{ m: 'auto 0' }}
                align="right"
                variant="body2"
                color="text.success"
              >
                <span style={{ fontSize: '12px'}}>{parseTime(event.timestamp)}</span>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineConnector />
                {
                  event.action.result === "success"
                    ? iconMap[event.action.type].icon
                    : (
                      <TimelineDot color="error">
                        <Lock sx={{ color: 'white' }} />
                      </TimelineDot>
                    )
                }
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent
                sx={{ m: 'auto 0' }}
                align="left"
                variant="body1"
                color="text.primary"
              >
                <span style={{ fontSize: '14px'}}>{event.action.result === "success" ? iconMap[event.action.type].text(event) : `Decrypt Failed by ${event.actor.id}`}</span>
              </TimelineContent>
            </TimelineItem>
          ))
        }
      </Timeline>
    </Drawer>
  )
}
