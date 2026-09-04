import React from 'react';

export default function Background() {
  return (
    <div className="af-background" aria-hidden="true">
      <div className="af-bg-circle af-bg-circle--tl" />
      <div className="af-bg-circle af-bg-circle--tr" />
      <div className="af-bg-circle af-bg-circle--bl" />
      <div className="af-bg-circle af-bg-circle--br" />

      <div className="af-bg-dot af-bg-dot--1" />
      <div className="af-bg-dot af-bg-dot--2" />
      <div className="af-bg-dot af-bg-dot--3" />

      <div className="af-bg-outline" />
    </div>
  );
}
