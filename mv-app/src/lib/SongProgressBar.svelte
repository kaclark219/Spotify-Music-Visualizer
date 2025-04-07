<script lang="ts">
    export let progress: number = 0;
    export let duration: number = 1;
  
    function formatTime(ms: number): string {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  </script>
  
  <div class="progress-container">
    <div class="time">{formatTime(progress)}</div>
    <div class="bar-container">
      <div class="bar" style="width: {Math.min(100, (progress / duration) * 100)}%"></div>
    </div>
    <div class="time">{formatTime(duration)}</div>
  </div>
  
  <style>
    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 60%;
      max-width: 1800px;
      margin-top: 6px;
      margin-left: 10px;
    }
  
    .time {
      font-size: 14px;
      color: #ccc;
      width: 40px;
      text-align: center;
    }
  
    .bar-container {
      flex: 1;
      height: 4px;
      background-color: #555;
      border-radius: 2px;
      overflow: hidden;
      position: relative;
    }
  
    .bar {
      height: 100%;
      background-color: white;
      transition: width 1s linear;
    }
  </style>
  