// components/VimeoEmbed.js

import styles from './VimeoEmbed.module.css';

/**
 * A responsive Vimeo embed component for Next.js.
 * @param {object} props - The component props.
 * @param {string} props.videoId - The ID of the Vimeo video (e.g., '199292954').
 * @param {string} [props.title] - Optional title for the iframe for accessibility.
 */
const VimeoEmbed = ({ videoId, title = "Vimeo video player" }) => {
  // A simple check to ensure the videoId is provided.
  if (!videoId) {
    console.error("VimeoEmbed component requires a 'videoId' prop.");
    return <div style={{color: 'red'}}>Error: Vimeo video ID is required.</div>;
  }

  return (
    <div className={styles.videoResponsive}>
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?h=eda7a94956&color=ffffff&title=0&byline=0&portrait=0`}
        title={title}
        className={styles.iframe}
        frameBorder="0"
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

export default VimeoEmbed;