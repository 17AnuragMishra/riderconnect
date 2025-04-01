import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Notifications } from "../dashboard/group/[id]/page";

const page = ( { heading, message, numberOfMessage }: Notifications ) => {
  const [read, setRead] = useState(false);
  return (
    <div className="flex justify-center">
      <div className="top flex items-center justify-between my-4 mx-4" style={{"width" : "80%"}}>
        <h1 style={{"fontSize": "2vw"}}>Notifications</h1>
        <Button>Mark all as read</Button>
      </div>
      <div>
        {
          // Notifications.map((element) => {
          //   <div className="row">
          //     <div className="col-9">
          //       <b>Shikhar Nigam</b>
          //       <p>Aur kya haal h? Holi khele the?</p>
          //     </div>
          //     <div className="col-3">
          //       <Button>Mark as Read</Button>
          //     </div>
          //   </div>
          // })
          <h1>hello</h1>
        }
      </div>
    </div>
  )
}

export default page