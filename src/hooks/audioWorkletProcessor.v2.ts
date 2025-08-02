export const workletProcessor = String.raw`
class RecorderProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.bufferSize = 2048;
    this.recordingBuffer = new Float32Array(this.bufferSize);
    this.recordingBufferIndex = 0;
    this.targetSampleRate = options?.processorOptions?.targetSampleRate || 16000;
    this.sourceSampleRate = options?.processorOptions?.sampleRate || sampleRate;
    this.ratio = this.targetSampleRate / this.sourceSampleRate;
    console.log('RecorderProcessor initialized:', {
      sourceSampleRate: this.sourceSampleRate,
      targetSampleRate: this.targetSampleRate,
      ratio: this.ratio
    });
  }

  resample(inputBuffer) {
    const outputLength = Math.floor(inputBuffer.length * this.ratio);
    const outputBuffer = new Float32Array(outputLength);
    
    for (let i = 0; i < outputLength; i++) {
      const index = i / this.ratio;
      const index0 = Math.floor(index);
      const index1 = Math.min(index0 + 1, inputBuffer.length - 1);
      const frac = index - index0;
      
      // Linear interpolation
      outputBuffer[i] = (1 - frac) * inputBuffer[index0] + frac * inputBuffer[index1];
    }
    
    return outputBuffer;
  }

  process(inputs, outputs, parameters) {
    const inputChannelData = inputs[0][0];
    if (!inputChannelData) {
      return true;
    }

    // Fill recording buffer
    for (let i = 0; i < inputChannelData.length; i++) {
      this.recordingBuffer[this.recordingBufferIndex++] = inputChannelData[i];
      
      // When buffer is full, resample and send
      if (this.recordingBufferIndex >= this.bufferSize) {
        const resampledData = this.resample(this.recordingBuffer);
        
        // Convert to 16-bit integer samples
        const intData = new Int16Array(resampledData.length);
        for (let j = 0; j < resampledData.length; j++) {
          intData[j] = Math.max(-32768, Math.min(32767, Math.floor(resampledData[j] * 32768)));
        }
        
        this.port.postMessage(intData.buffer, [intData.buffer]);
        this.recordingBufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('recorder-processor', RecorderProcessor);`;
