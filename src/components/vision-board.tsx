"use client";

export function VisionBoard() {
  console.log("VISION BOARD LOADED FROM GITHUB!");
  
  return (
    <div>
      <h1 style={{color: 'red', fontSize: '48px', background: 'yellow', padding: '20px'}}>
        GITHUB TEST - TIMESTAMP: {new Date().toISOString()}
      </h1>
      <p>If you see this, the file updated successfully!</p>
      <button onClick={() => alert('Button works!')}>
        Click me!
      </button>
    </div>
  );
}
