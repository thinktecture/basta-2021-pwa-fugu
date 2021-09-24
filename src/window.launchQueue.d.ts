interface Window {
  launchQueue: {
    setConsumer(callback: (params: { files: any }) => void)
  }
}
