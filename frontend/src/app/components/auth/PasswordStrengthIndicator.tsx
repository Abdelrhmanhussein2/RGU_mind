interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getStrength = (pass: string): { level: number; text: string; color: string } => {
    if (!pass) return { level: 0, text: "", color: "" };

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;

    if (strength <= 2) return { level: 1, text: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { level: 2, text: "Fair", color: "bg-yellow-500" };
    if (strength <= 4) return { level: 3, text: "Good", color: "bg-green-500" };
    return { level: 4, text: "Strong", color: "bg-green-600" };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength.level ? strength.color : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">
        Password strength: <span className="font-medium">{strength.text}</span>
      </p>
    </div>
  );
}
