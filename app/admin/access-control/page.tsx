import { UserRoles } from "@/app/admin/access-control/access-control"
import { auth } from '@/auth'
import { cookies } from 'next/headers'
import { GetTranslation } from "@/components/translation-helper/ClientTranslations"

export const runtime = 'nodejs'
export const preferredRegion = 'home'
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const TextDirection = process.env.TEXT_DIRECTION

export default async function SettingsAccountPage() {
  const cookieStore = cookies()
  const session = await auth({ cookieStore })

  // Language and Translation
  var TranslationData = require(`@/translation/${process.env.BIZGPT_FRONTEND_LANGUAGE}.json`);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium" dir={TextDirection}>
          {/* {TranslationData["Manage User Roles"]} */}
          <GetTranslation text="Manage User Roles" />
          </h3>
        <p className="text-sm text-muted-foreground" dir={TextDirection}>
        {/* {TranslationData["Assign roles to users using the table below"]} */}
        <GetTranslation text="Assign roles to users using the table below" />        
        </p>
        <></>
        <p className="text-sm text-muted-foreground" dir={TextDirection}> 
        {/* {TranslationData["* Please wait for a few seconds for the changes you have made to take effect."]} */}
        <GetTranslation text="* Please wait for a few seconds for the changes you have made to take effect." />
        
         </p>
      </div>
      <UserRoles user_email={session?.user?.email} />
    </div>
  )
}
