import { Image, LogOut, Tag, Users, } from "lucide-react"
import { useRouter } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"


const items = [

    {
        title: "Image Management",
        url: "/images",
        icon: Image,
    },
    {
        title: "Tag Management",
        url: "/tags",
        icon: Tag,
    },
    {
        title: "Group Management",
        url: "/group",
        icon: Users,
    }


]
const footer_items = [
    {
        title: "Logout",
        url: "#",
        icon: LogOut,
    },

]

export function AppSidebar() {
    const router = useRouter()

    const { logout } = useAuth()
    const handleLogout = () => {
        logout()
    }
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                {footer_items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild onClick={item.title === "Logout" ? handleLogout : undefined}>
                            <a href={item.url}>
                                <item.icon />
                                <span>{item.title}</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarFooter>
        </Sidebar>
    )
}