"use client";

export function VisionBoard() {
  console.log("VISION BOARD COMPONENT IS LOADING!!!");
  
  return (
    <div>
      <h1 style={{color: 'red', fontSize: '48px'}}>VISION BOARD TEST</h1>
      <p>If you can see this red text, the component is loading!</p>
      <button onClick={() => console.log('Button clicked!')}>
        Click me for console test
      </button>
    </div>
  );
}
