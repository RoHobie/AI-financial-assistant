import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGoalModal = ({ isOpen, onClose }: CreateGoalModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "emergency",
    targetAmount: "",
    startDate: new Date().toISOString().split("T")[0],
    targetDate: "",
    automated: false,
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return apiRequest("POST", "/api/goals", goalData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      resetForm();
      onClose();
      toast({
        title: "Goal created",
        description: "Your financial goal has been created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create goal. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "emergency",
      targetAmount: "",
      startDate: new Date().toISOString().split("T")[0],
      targetDate: "",
      automated: false,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.targetAmount || !formData.targetDate) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    const targetAmount = parseFloat(formData.targetAmount);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid target amount greater than 0.",
        variant: "destructive",
      });
      return;
    }
    
    const startDate = new Date(formData.startDate);
    const targetDate = new Date(formData.targetDate);
    
    if (targetDate <= startDate) {
      toast({
        title: "Invalid dates",
        description: "Target date must be after start date.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit form
    createGoalMutation.mutate({
      ...formData,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      status: "in_progress",
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <span className="material-icons text-primary mr-2">flag</span>
              Create New Financial Goal
            </DialogTitle>
            <DialogDescription>
              Set up a new goal to track your financial progress
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Goal Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Emergency Fund, Vacation, etc."
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="targetAmount">Target Amount</Label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  $
                </span>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="text"
                  className="pl-7"
                  placeholder="0.00"
                  value={formData.targetAmount}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergency">Emergency Fund</SelectItem>
                  <SelectItem value="retirement">Retirement</SelectItem>
                  <SelectItem value="home">Home Purchase</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="vehicle">Vehicle</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="targetDate">Target Date</Label>
                <Input
                  id="targetDate"
                  name="targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="What are you saving for?"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="automated"
                checked={formData.automated}
                onCheckedChange={(checked) => handleSwitchChange("automated", checked)}
              />
              <div>
                <Label htmlFor="automated">Set up automated contributions</Label>
                <p className="text-sm text-gray-500">We'll help you automate transfers to reach your goal</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createGoalMutation.isPending}
            >
              {createGoalMutation.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGoalModal;
