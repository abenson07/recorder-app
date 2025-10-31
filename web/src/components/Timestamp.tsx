import React from 'react';
import { Typography } from '@mui/material';

interface TimestampProps {
  time: string;
  fontSize?: string;
  fontWeight?: number;
  color?: string;
  lineHeight?: number | string;
}

const Timestamp: React.FC<TimestampProps> = ({
  time,
  fontSize = '56px',
  fontWeight = 200,
  color = '#FFFFFF',
  lineHeight = 1,
}) => {
  return (
    <Typography
      sx={{
        fontSize,
        fontWeight,
        color,
        lineHeight,
      }}
    >
      {time}
    </Typography>
  );
};

export default Timestamp;

