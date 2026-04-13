# Component Composition

## Contents

- Items always inside their Group component
- Callouts use Alert
- Empty states (compose with Card, no Empty primitive)
- Toast notifications use sonner
- Choosing between overlay components
- Dialog, Sheet, and Drawer always need a Title
- Card structure
- Button has no isPending or isLoading prop
- TabsTrigger must be inside TabsList
- Avatar always needs AvatarFallback
- Use Separator instead of raw hr or border divs
- Use Skeleton for loading placeholders
- Use Badge instead of custom styled spans

---

## Items always inside their Group component

Never render items directly inside the content container.

**Incorrect:**

```tsx
<SelectContent>
  <SelectItem value="apple">Apple</SelectItem>
  <SelectItem value="banana">Banana</SelectItem>
</SelectContent>
```

**Correct:**

```tsx
<SelectContent>
  <SelectGroup>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectGroup>
</SelectContent>
```

This applies to all group-based components:

| Child / list item                                          | Group               |
| ---------------------------------------------------------- | ------------------- |
| `SelectItem`, `SelectLabel`                                | `SelectGroup`       |
| `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSub` | `DropdownMenuGroup` |
| `MenubarItem`                                              | `MenubarGroup`      |
| `ContextMenuItem`                                          | `ContextMenuGroup`  |
| `CommandItem`                                              | `CommandGroup`      |

---

## Callouts use Alert

```tsx
<Alert>
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Something needs attention.</AlertDescription>
</Alert>
```

---

## Empty states (compose with Card, no Empty primitive)

There is no `Empty` component in this boilerplate. Build empty states from `Card` and typography tokens.

```tsx
import { FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';

<Card className="flex flex-col items-center gap-4 py-12">
  <FolderIcon className="text-muted-foreground size-10" />
  <div className="flex flex-col items-center gap-1 text-center">
    <CardTitle className="text-base">No projects yet</CardTitle>
    <p className="text-muted-foreground text-sm">
      Get started by creating a new project.
    </p>
  </div>
  <Button>Create project</Button>
</Card>;
```

---

## Toast notifications use sonner

```tsx
import { toast } from 'sonner';

toast.success('Changes saved.');
toast.error('Something went wrong.');
toast('File deleted.', {
  action: { label: 'Undo', onClick: () => undoDelete() },
});
```

---

## Choosing between overlay components

| Use case                           | Component     |
| ---------------------------------- | ------------- |
| Focused task that requires input   | `Dialog`      |
| Destructive action confirmation    | `AlertDialog` |
| Side panel with details or filters | `Sheet`       |
| Mobile-first bottom panel          | `Drawer`      |
| Quick info on hover                | `HoverCard`   |
| Small contextual content on click  | `Popover`     |

---

## Dialog, Sheet, and Drawer always need a Title

`DialogTitle`, `SheetTitle`, `DrawerTitle` are required for accessibility. Use `className="sr-only"` if visually hidden.

```tsx
<DialogContent>
  <DialogHeader>
    <DialogTitle>Edit Profile</DialogTitle>
    <DialogDescription>Update your profile.</DialogDescription>
  </DialogHeader>
  ...
</DialogContent>
```

---

## Card structure

Use full composition — don't dump everything into `CardContent`:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Team Members</CardTitle>
    <CardDescription>Manage your team.</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
  <CardFooter>
    <Button>Invite</Button>
  </CardFooter>
</Card>
```

---

## Button has no isPending or isLoading prop

Compose with `Loader2` from `lucide-react` + `animate-spin` + `data-icon` + `disabled`:

```tsx
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

<Button disabled>
  <Loader2 data-icon="inline-start" className="animate-spin" />
  Saving...
</Button>;
```

---

## TabsTrigger must be inside TabsList

Never render `TabsTrigger` directly inside `Tabs` — always wrap in `TabsList`:

```tsx
<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">...</TabsContent>
</Tabs>
```

---

## Avatar always needs AvatarFallback

Always include `AvatarFallback` for when the image fails to load:

```tsx
<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

## Use existing components instead of custom markup

| Instead of                                         | Use                                  |
| -------------------------------------------------- | ------------------------------------ |
| `<hr>` or `<div className="border-t">`             | `<Separator />`                      |
| `<div className="animate-pulse">` with styled divs | `<Skeleton className="h-4 w-3/4" />` |
| `<span className="rounded-full bg-green-100 ...">` | `<Badge variant="secondary">`        |
