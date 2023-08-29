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


export default ({ showAudit, setShowAudit }) => {
  return (
    <Drawer
      anchor={'left'}
      open={showAudit}
      onClose={() => setShowAudit(false)}
    >
      <h3 style={{ textAlign: 'center', margin: 0, minWidth: '500px' }}>Audit</h3>
      <Timeline position="alternate">
        <TimelineItem>
          <TimelineOppositeContent
            sx={{ m: 'auto 0' }}
            align="right"
            variant="body2"
            color="text.success"
          >
            <span style={{ fontSize: '12px'}}>{parseTime(new Date().toISOString())}</span>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineConnector />
              <TimelineDot color="error">
                <Lock sx={{ color: 'white' }} />
              </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent
            sx={{ m: 'auto 0' }}
            align="left"
            variant="body1"
            color="text.primary"
          >
            <span style={{ fontSize: '14px'}}>Decrypted Failed by username</span>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineOppositeContent
            sx={{ m: 'auto 0' }}
            align="right"
            variant="body2"
            color="text.success"
          >
            <span style={{ fontSize: '12px'}}>{parseTime(new Date().toISOString())}</span>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineConnector />
              <TimelineDot color="info">
                <LockOpen sx={{ color: 'white' }} />
              </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent
            sx={{ m: 'auto 0' }}
            align="left"
            variant="body1"
            color="text.primary"
          >
            <span style={{ fontSize: '14px'}}>Decrypt by username</span>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineOppositeContent
            sx={{ m: 'auto 0' }}
            align="right"
            variant="body2"
            color="text.success"
          >
            <span style={{ fontSize: '12px'}}>{parseTime(new Date().toISOString())}</span>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineConnector />
            <TimelineDot color="primary">
              <LockPerson sx={{ color: 'white' }} />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent
            sx={{ m: 'auto 0' }}
            align="left"
            variant="body1"
            color="text.primary"
          >
            <span style={{ fontSize: '14px'}}>Encrypted by username</span>
          </TimelineContent>
        </TimelineItem>
        <TimelineItem>
          <TimelineOppositeContent
            sx={{ m: 'auto 0' }}
            align="right"
            variant="body2"
            color="text.success"
          >
            <span style={{ fontSize: '12px'}}>{parseTime(new Date().toISOString())}</span>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineConnector />
            <TimelineDot color="error">
              <RemoveCircle sx={{ color: 'white' }} />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent
            sx={{ m: 'auto 0' }}
            align="left"
            variant="body1"
            color="text.primary"
          >
            <span style={{ fontSize: '14px'}}>Removed task by username</span>
          </TimelineContent>
        </TimelineItem>
      </Timeline>
    </Drawer>
  )
}
