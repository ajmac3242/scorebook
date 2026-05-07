import React from "react";
import { Card, CardContent, Typography } from "@mui/material";
import { AnimatedNumber } from "./AnimatedNumber";

/**
 * Interface representing the props for the StatCard component.
 */
interface StatCardProps {
  label: string;
  value: string | number;
}

/**
 * Standardized component for displaying a statistic within a card.
 *
 * @param {StatCardProps} props - Component props.
 * @returns {React.ReactElement}
 */
export const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <Card
    sx={{
      bgcolor: "#FFFDF5",
      border: "1px solid #D1D1D1",
      transition: "transform 0.2s",
      "&:hover": { transform: "translateY(-4px)" },
    }}
  >
    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: "var(--serif)" }}>
        {typeof value === "number" ? <AnimatedNumber value={value} /> : value}
      </Typography>
    </CardContent>
  </Card>
);
