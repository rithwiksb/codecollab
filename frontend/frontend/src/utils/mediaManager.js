// Global media stream manager for proper camera cleanup
class MediaStreamManager {
  constructor() {
    this.activeStreams = new Set();
    this.activeTracks = new Set();
    
    // Track when streams are created
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await originalGetUserMedia(constraints);
      this.registerStream(stream);
      return stream;
    };
  }
  
  registerStream(stream) {
    console.log('Registering new media stream with', stream.getTracks().length, 'tracks');
    this.activeStreams.add(stream);
    
    stream.getTracks().forEach(track => {
      this.activeTracks.add(track);
      
      // Listen for track end to clean up
      track.addEventListener('ended', () => {
        this.activeTracks.delete(track);
      });
    });
  }
  
  stopAllStreams() {
    console.log('Stopping all active streams:', this.activeStreams.size);
    console.log('Stopping all active tracks:', this.activeTracks.size);
    
    // Stop all registered streams
    this.activeStreams.forEach(stream => {
      stream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          console.log(`Stopping ${track.kind} track (${track.label})`);
          track.stop();
        }
      });
    });
    
    // Stop all registered tracks
    this.activeTracks.forEach(track => {
      if (track.readyState === 'live') {
        console.log(`Force stopping ${track.kind} track`);
        track.stop();
      }
    });
    
    // Clear collections
    this.activeStreams.clear();
    this.activeTracks.clear();
    
    console.log('All media streams and tracks stopped');
  }
  
  getActiveCount() {
    return {
      streams: this.activeStreams.size,
      tracks: this.activeTracks.size
    };
  }
}

// Create global instance
window.mediaStreamManager = new MediaStreamManager();

export default window.mediaStreamManager;