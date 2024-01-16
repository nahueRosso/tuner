import React, { useState, useEffect } from 'react';
import { Select, MenuItem, InputLabel } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/system';

import './App.css';

const StyledSelect = styled(Select)({
  width: '300px',
  marginBottom: '16px',
});

const FREQUENCY_OPTIONS: number[] = Array.from({ length: 52 }, (_, index) => 415 + index);

const App: React.FC = () => {
  const [baseFreq, setBaseFreq] = useState<number>(440);
  const [frequencyText, setFrequencyText] = useState<number | null>(0);
  const [rotationAngle, setRotationAngle] = useState<number | null>(0);
  const [backgroundColor, setBackgroundColor] = useState<string | number | undefined>('#AAFAC8');

  const calculateRotation: (frequencies: number) => number = (frequencies) => {
    return -Math.log2(frequencies / baseFreq) * 360;
  };

  const meetsRequirements: (number: number) => boolean = (number) => {
    return (
      Array.from({ length: 5 }, (_, i) => number + i).some(isMultipleOf30) ||
      Array.from({ length: 5 }, (_, i) => number - i).some(isMultipleOf30)
    );
  };

  const isMultipleOf30: (number: number) => boolean = (number) => number % 30 === 0;

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const microphone = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        microphone.connect(analyser);

        analyser.fftSize = 16384;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const sampleRate = context.sampleRate;

        const processAudio: () => void = () => {
          analyser.getByteFrequencyData(dataArray);

          const frequencies = Array.from({ length: bufferLength }, (_, i) => (i * sampleRate) / analyser.fftSize);

          const maxAmplitudeIndex = dataArray.indexOf(Math.max(...Array.from(dataArray)));
          const peakFrequency = frequencies[maxAmplitudeIndex];

          setFrequencyText(Math.round(peakFrequency));
          setRotationAngle(calculateRotation(peakFrequency));
          setBackgroundColor(meetsRequirements(Math.round(peakFrequency)) ? '#B592A0' : '#AAFAC8');

          requestAnimationFrame(processAudio);
        };

        processAudio();
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
      });
  }, []);

  const handleBaseFreqChange: (event: SelectChangeEvent<unknown>) => void = (event) => {
    const newBaseFreq = parseInt(event.target.value as string, 10);

    if (newBaseFreq >= 415 && newBaseFreq <= 466) {
      setBaseFreq(newBaseFreq);
    }
  };

  return (
    <div style={{ background: backgroundColor ?? 'initial' }}>
      <div className="first-box">
        <h1>Tone Frequency Detector</h1>
        <InputLabel>Reference A4</InputLabel>
        <StyledSelect
          label="Frequency"
          variant="outlined"
          value={baseFreq}
          onChange={handleBaseFreqChange}
        >
          {FREQUENCY_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </StyledSelect>
      </div>
      <div className="second-box">
        <div className="wheel" style={{ transform: `rotate(${rotationAngle}deg)` }}></div>

        <div className="frequency-text-box">
          <h3 className="frequency-text">{String(frequencyText)} Hz</h3>
        </div>
      </div>
      <div
        className="first-wheel-fill"
        style={{ background: `linear-gradient(to left, transparent, ${backgroundColor})` ?? 'initial' }}
      ></div>
      <div
        className="second-wheel-fill"
        style={{ background: `linear-gradient(to right, transparent, ${backgroundColor})` ?? 'initial' }}
      ></div>
    </div>
  );
};

export default App;
