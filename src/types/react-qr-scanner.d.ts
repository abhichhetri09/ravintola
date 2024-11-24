declare module "react-qr-scanner" {
  import { Component } from "react";

  interface QrReaderProps {
    delay?: number;
    onError: (error: any) => void;
    onScan: (data: string | null) => void;
    style?: object;
    constraints?: {
      facingMode?: string;
    };
  }

  export default class QrReader extends Component<QrReaderProps> {}
}
