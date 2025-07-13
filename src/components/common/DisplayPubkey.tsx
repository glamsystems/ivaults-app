interface DisplayPubkeyProps {
  pubkey: string;
}

export const DisplayPubkey: React.FC<DisplayPubkeyProps> = ({ pubkey }) => {
  return `${pubkey.slice(0, 4)}...${pubkey.slice(-4)}`;
};