import { useState, useContext } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthContext from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

export function LoginForm() {
  const { showAlert } = useAlert();

  const { login, register } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("login");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (activeTab === "login") {
        const user = await login(formData.email, formData.password);
        const welcomeMessage =
          user.role === "admin"
            ? "Welcome back, Administrator!"
            : "Logged in successfully!";
        showAlert(welcomeMessage, "success");
      } else {
        if (formData.password !== formData.confirmPassword) {
          showAlert("Passwords do not match", "warning");
          return;
        }

        const isValidPassword = passwordRequirements.every((req) =>
          req.check(formData.password)
        );

        if (!isValidPassword) {
          showAlert("Password doesn't meet requirements", "warning");
          return;
        }

        await register({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
        });
        showAlert("Registred successfuly!", "success");
      }
    } catch (err) {
      const serverError =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        err.message;
      showAlert(serverError, "error");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordRequirements = [
    {
      text: "Password must contain at least one uppercase letter.",
      check: (pass) => /[A-Z]/.test(pass),
    },
    {
      text: "Password must contain at least one number.",
      check: (pass) => /\d/.test(pass),
    },
    {
      text: "Password must contain at least one symbol.",
      check: (pass) => /[^A-Za-z0-9]/.test(pass),
    },
    {
      text: "Password must be at least 6 characters long.",
      check: (pass) => pass.length >= 6,
    },
  ];

  return (
    <div className="mx-auto w-[400px] min-h-[520px] p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="register" className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Repeat Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <ul className="space-y-1 text-sm">
              {passwordRequirements.map((req) => (
                <li
                  key={req.text}
                  className={cn(
                    "flex items-center gap-2",
                    req.check(formData.password)
                      ? "text-green-500"
                      : "text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      req.check(formData.password)
                        ? "bg-green-500"
                        : "bg-muted-foreground"
                    )}
                  />
                  {req.text}
                </li>
              ))}
            </ul>
            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LoginForm;
