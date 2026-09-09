"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CardDecorator } from '@/components/ui/card-decorator'
import { Github, Linkedin, Globe } from 'lucide-react'


const team = [
  {
    id: 1,
    name: 'Nguyễn Minh Triết',
    role: 'Co-Founder & CEO',
    description: '12 năm kinh nghiệm quản lý & vận hành chuỗi bán lẻ thiết bị công nghệ.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=60&w=150&auto=format&fit=crop',
    fallback: 'NT',
    social: {
      linkedin: '#',
      github: '#',
      website: '#'
    }
  },
  {
    id: 2,
    name: 'Trần Minh Hoàng',
    role: 'Chief Technology Officer',
    description: 'Cựu kỹ sư trưởng AI/ML tại tập đoàn công nghệ lớn. Chuyên gia dữ liệu lớn.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=60&w=150&auto=format&fit=crop',
    fallback: 'MH',
    social: {
      linkedin: '#',
      github: '#',
      website: '#'
    }
  },
  {
    id: 3,
    name: 'Phạm Thị Hải Yến',
    role: 'Head of Product',
    description: 'Chuyên gia thiết kế giải pháp POS & trải nghiệm người dùng hệ thống quản trị retail.',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?q=60&w=150&auto=format&fit=crop',
    fallback: 'HY',
    social: {
      linkedin: '#',
      github: '#',
      website: '#'
    }
  },
  {
    id: 4,
    name: 'Lê Quốc Khánh',
    role: 'Head of Customer Success',
    description: 'Đồng hành triển khai chuyển đổi số và hỗ trợ kỹ thuật cho hơn 1.000 chuỗi cửa hàng.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=60&w=150&auto=format&fit=crop',
    fallback: 'QK',
    social: {
      linkedin: '#',
      github: '#',
      website: '#'
    }
  }
]

export function TeamSection() {
  return (
    <section id="team" className="py-24 sm:py-32">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Đội ngũ sáng lập
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Đội ngũ của chúng tôi
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Chúng tôi gồm những chuyên gia công nghệ và vận hành bán lẻ đầy nhiệt huyết, cam kết đem lại giải pháp tốt nhất cho sự phát triển chuỗi cửa hàng của bạn.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-4">
          {team.map((member) => (
            <Card key={member.id} className="shadow-xs py-2">
              <CardContent className="p-4">
                <div className="text-center">
                  {/* Avatar */}
                  <div className="flex justify-center mb-4">
                    <CardDecorator>
                      <Avatar className="h-24 w-24 border shadow-lg">
                        <AvatarImage
                          src={member.image}
                          alt={member.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="text-lg font-semibold">
                          {member.fallback}
                        </AvatarFallback>
                      </Avatar>
                    </CardDecorator>
                  </div>

                  {/* Name and Role */}
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-primary mb-3">
                    {member.role}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                    {member.description}
                  </p>

                  {/* Social Links */}
                  <div className="flex items-center justify-center gap-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} GitHub`}
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 cursor-pointer hover:text-primary"
                      asChild
                    >
                      <a
                        href={member.social.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Website`}
                      >
                        <Globe className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
