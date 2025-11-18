import { BrowserProvider, JsonRpcSigner } from 'ethers';

export interface Roles {
  isAdmin: boolean;
  isMinter: boolean;
  isRevoker: boolean;
}

export interface AppProps {
  provider?: BrowserProvider;
  signer?: JsonRpcSigner;
  account?: string;
  roles?: Roles;
  contractAddress?: string;
  onGoHome?: () => void;
}

export type TxStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

export const CONTRACT_ADDRESS = '0x1E0AA66Ad5B46e2af5a5587BEcf7Fb15b6E043fc';

export const CONTRACT_ABI = [
  "function mintDiploma(address student, string memory metadataURI, string memory pdfHash) external",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function getPdfHash(uint256 tokenId) public view returns (string)",
  "function nextId() external view returns (uint256)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function hasMinterRole(address account) external view returns (bool)",
  "function hasRevokerRole(address account) external view returns (bool)",
  "function revokeDiploma(uint256 tokenId) external",
  "function verifyDiploma(uint256 tokenId) external view returns (address _issuer, address holder, string memory metadataURI, string memory pdfHash, bool valid)"
];

export const DEFAULT_METADATA =
  "https://violet-patient-tiger-874.mypinata.cloud/ipfs/bafkreieetfhppak5kdnuljt45hy462yvoghlawzovobtm32m7ifhiqcmtq";

// Helper to allow window.ethereum usage
declare global {
  interface Window {
    ethereum: any;
  }
}