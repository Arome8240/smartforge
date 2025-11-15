'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check, Save, Download } from 'lucide-react'
import { SolidityPreview } from '@/components/contract-editor/solidity-preview'

export default function SettingsPage() {
  const [copied, setCopied] = useState(false)
  const [contractName, setContractName] = useState('MyContract')
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum')

  const apiKey = 'pk_' + Math.random().toString(36).substring(2, 15)

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sampleSolidityCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${contractName} {
    // Structs
    struct UserData {
        address wallet;
        uint256 balance;
        string username;
        bool isActive;
    }

    // State Variables
    mapping(address => UserData) public users;
    mapping(address => uint256) public balances;

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Constructor
    constructor(address _owner) {
        owner = _owner;
    }

    // Functions
    function createUser(
        string memory _username,
        bool _isActive
    ) external {
        users[msg.sender] = UserData({
            wallet: msg.sender,
            balance: 0,
            username: _username,
            isActive: _isActive
        });
    }

    function updateBalance(uint256 _amount) external {
        balances[msg.sender] += _amount;
    }

    function getUser(address _address) external view returns (UserData memory) {
        return users[_address];
    }
}`

  const networks = [
    { id: 'ethereum', name: 'Ethereum Mainnet', chainId: 1 },
    { id: 'sepolia', name: 'Sepolia Testnet', chainId: 11155111 },
    { id: 'polygon', name: 'Polygon', chainId: 137 },
    { id: 'arbitrum', name: 'Arbitrum One', chainId: 42161 },
    { id: 'optimism', name: 'Optimism', chainId: 10 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Project Settings</h1>
        <p className="text-muted-foreground">
          Configure deployment settings and preview your contract
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Contract Name</label>
                <Input
                  placeholder="MyContract"
                  value={contractName}
                  onChange={(e) => setContractName(e.target.value)}
                  className="bg-input border-primary/20 text-foreground focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Version</label>
                <Input
                  placeholder="1.0.0"
                  defaultValue="1.0.0"
                  className="bg-input border-primary/20 text-foreground focus:border-primary"
                />
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deployment Tab */}
        <TabsContent value="deployment" className="space-y-4">
          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Deployment Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Target Network</label>
                <select
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  className="w-full px-3 py-2 bg-input border border-primary/20 rounded-lg text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {networks.map((network) => (
                    <option key={network.id} value={network.id} className="bg-background">
                      {network.name} (Chain ID: {network.chainId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">RPC Endpoint</label>
                <Input
                  placeholder="https://eth-mainnet.g.alchemy.com/v2/..."
                  className="bg-input border-primary/20 text-foreground focus:border-primary font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">API Key</label>
                <div className="flex gap-2">
                  <Input
                    value={apiKey}
                    readOnly
                    className="bg-input border-primary/20 text-foreground font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopyApiKey}
                    variant="outline"
                    className="border-primary/20 text-foreground hover:bg-muted shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-secondary/10 border border-secondary/20 rounded-lg">
                <p className="text-sm text-foreground mb-3">
                  Keep your API key secure and never share it publicly.
                </p>
              </div>

              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          <SolidityPreview code={sampleSolidityCode} />

          <Card className="border-primary/20 bg-card/50">
            <CardHeader>
              <CardTitle className="text-foreground">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                Download Solidity File
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/20 text-foreground hover:bg-muted flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Contract Code
              </Button>
              <Button
                variant="outline"
                className="w-full border-primary/20 text-foreground hover:bg-muted flex items-center justify-center gap-2"
              >
                Deploy to {networks.find((n) => n.id === selectedNetwork)?.name}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-secondary/20 bg-secondary/5">
            <CardHeader>
              <CardTitle className="text-sm text-foreground">About Generated Code</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                This is a sample contract generated from your visual configuration.
                The code is production-ready and can be deployed directly.
              </p>
              <p>
                Always audit your contracts with tools like Certora or OpenZeppelin's auditing services before production.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
