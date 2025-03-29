import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Coins, Edit, Package, TrashIcon, UserIcon } from 'lucide-react';

export default function ClientDetails({ client, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState(client);

  if (!client) return null;

  const totalOrders = client.orders?.length || 0;
  const completedOrders = client.orders?.filter(order => order.status === 'completed').length || 0;
  const pendingPayment = client.orders?.filter(order => order.status !== 'completed').reduce((sum, order) => sum + (order.price - order.initialPayment), 0) || 0;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedClient({ ...editedClient, [name]: value });
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(editedClient);
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(client.id);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-secondary to-primary text-white">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full">
              <UserIcon className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-xl">{client.name}</CardTitle>
              <CardDescription className="text-white/80">Client depuis {new Date(client.joinedDate).toLocaleDateString()}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(true)} className="border-white text-white hover:bg-white/20">
              <Edit className="h-4 w-4 mr-1" /> Modifier
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <TrashIcon className="h-4 w-4 mr-1" /> Supprimer
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background text-foreground">
                <DialogHeader>
                  <DialogTitle>Supprimer le client</DialogTitle>
                  <DialogDescription>
                    Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Annuler</Button>
                  <Button variant="destructive" onClick={handleDelete}>Supprimer</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isEditing ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Client Name</Label>
                <Input id="name" name="name" value={editedClient.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="realm">Realm</Label>
                <Input id="realm" name="realm" value={editedClient.realm} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="character">Character Name</Label>
                <Input id="character" name="character" value={editedClient.character} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discord">Discord</Label>
                <Input id="discord" name="discord" value={editedClient.discord} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" value={editedClient.notes} onChange={handleInputChange} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid grid-cols-3 w-full rounded-none border-b bg-muted">
              <TabsTrigger value="details" className="data-[state=active]:bg-background">Détails du client</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-background">Commandes</TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-background">Paiements</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-32">Character:</span>
                      <span className={`font-medium ${client.character ? '' : 'text-muted-foreground italic'}`}>
                        {client.character || 'Not provided'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-32">Realm:</span>
                      <span className="font-medium">{client.realm}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground min-w-32">Discord:</span>
                      <span className={`font-medium ${client.discord ? '' : 'text-muted-foreground italic'}`}>
                        {client.discord || 'Not provided'}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-lg font-medium mt-6 mb-2">Notes</h3>
                  <p className="text-muted-foreground">{client.notes || 'No notes available'}</p>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-4 border-primary/20 bg-background">
                      <div className="flex items-center justify-between">
                        <Package className="h-8 w-8 text-amber-500" />
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Orders</p>
                          <p className="text-2xl font-bold">{totalOrders}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 border-green-500/20 bg-background">
                      <div className="flex items-center justify-between">
                        <CalendarIcon className="h-8 w-8 text-emerald-500" />
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Completed</p>
                          <p className="text-2xl font-bold">{completedOrders}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-4 border-secondary/20 bg-background">
                      <div className="flex items-center justify-between">
                        <Coins className="h-8 w-8 text-blue-500" />
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Pending</p>
                          <p className="text-2xl font-bold">{pendingPayment} <span className="text-xs">gold</span></p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="p-6">
              {client.orders && client.orders.length > 0 ? (
                <div className="space-y-4">
                  {client.orders.map((order, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {order.profession} (1-{order.levelRange}) 
                            <Badge className={
                              order.status === 'completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {order.status}
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Created on {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.price} gold</p>
                          <p className="text-sm text-muted-foreground">
                            Deposit: {order.initialPayment} gold
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No Orders Yet</h3>
                  <p className="text-muted-foreground">This client hasn't placed any orders yet.</p>
                  <Button className="mt-4">Create New Order</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="payments" className="p-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Payment History</h3>
                  <Button size="sm">Record Payment</Button>
                </div>
                
                {client.payments && client.payments.length > 0 ? (
                  <div className="space-y-4">
                    {client.payments.map((payment, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium">{payment.type} Payment</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-lg">{payment.amount} gold</p>
                            <p className="text-xs text-muted-foreground">
                              {payment.orderReference && `For order #${payment.orderReference}`}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Coins className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Payments Yet</h3>
                    <p className="text-muted-foreground">No payment records found for this client.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
