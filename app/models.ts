export class Model {
  type: string
  name: string
  private _status: string;
  private _onStatusChangeListeners: Record<string, ((str: string) => void)>;


  constructor() {
    this.type = "default"
    this.name = "nameless"
    this._status = "unknown"
    this._onStatusChangeListeners = {}
  }
  set status(v: string) {
    this._status = v
    this.runOnStatusChangeListener(v)
  }
  get status() {
    return this._status
  }

  addOnStatusChangeListener(f: (str: string) => void) {
    const id = Math.random()
    this._onStatusChangeListeners[id] = f
    return id
  }
  removeOnStatusChangeListener(id: string) {
    delete (this._onStatusChangeListeners[id])
  }

  private runOnStatusChangeListener(newStatus: string) {
    for (const f of Object.values(this._onStatusChangeListeners)) {
      f(newStatus)
    }
  }

  async chat(history: { role: string, content: string,images?:string[] }[], callback: (response: { role: string; content: string, images?: string[] }[]) => void): Promise<any> {
    return undefined
  }

  async delete(): Promise<{ success: boolean }> { return ({ success: false }) }

  async download(): Promise<{ success: boolean }> { return ({ success: false }) }
}

export class CloudflareModel extends Model {
  url: string
  constructor(name: string, url: string) {
    super()
    this.name = name
    this.type = "cloudflare"
    this.url = url
  }

  override async chat(history: { role: string; content: string,images?:string[] }[], callback: (response: { role: string; content: string; images?: string[]; }[]) => void): Promise<any> {

    // override async chat(history: { role: string; content: string }[]) {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "messages": history.map(e=>({role:e.role,image:e.images?.at(0),content:e.content}))
      })
    })

    const data = await res.json() as { response: string }

    let mock = [...history]
    
    data.response.split(" ").forEach((v,i)=>{
      setTimeout(()=>{
        mock[mock.length-1].content += v + ' '
        // mock[mock.length-1].content = mock[mock.length-1].content.trim() 
        callback([...mock])
      },i*30)
    })
  }
}

export class OllamaModel extends Model {
  modelId: string
  ollamaURL: string

  constructor(id: string, ollamaURL: string) {
    super()
    this.ollamaURL = ollamaURL
    this.type = "ollama"
    this.modelId = id
    this.name = id
  }

  override async chat(history: { role: string; content: string, images: string[] }[], callback: (response: { role: string; content: string, images: string[] }[]) => void): Promise<any> {
    let mock = [...history]
    const res = await fetch(`${this.ollamaURL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.modelId,
        messages: [...mock].map(f => { f.images = f.images?.map(i => i.replace(/^data:image\/.+?;base64,/, "")); return f })
      })
    })
    const reader = res.body?.getReader();
    if (!reader) {
      console.warn("No reader!");
      return
    }

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      let chunk = "[" + decoder.decode(value, { stream: true }).replace(/\n/g, ",")
      if (chunk.endsWith(",")) chunk = chunk.slice(0, chunk.length - 1)
      chunk += "]"
      if (!mock[mock.length - 1].content) mock[mock.length - 1].content = ""
      console.log(chunk)
      mock[mock.length - 1].content += JSON.parse(chunk).reduce((ac: string, next: OllamaChatResponseChunk) => next.error ? (ac + next.error) : (ac + next.message?.content), "")
      mock = [...mock]
      callback(mock)
      if (done) break;
    }
  }

  override async delete() {
    console.log("deleting", this.name)
    this.status = "Removing"
    const res = await fetch(`${this.ollamaURL}/api/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "model": this.modelId
      })
    })

    if (res.ok) {
      this.status = "Removed"
      return ({ success: true })
    } else {
      this.status = "Unknown"
      return ({ success: false })
    }
  }

  override async download() {
    console.log("downloading", this.modelId)
    const res = await fetch(`${this.ollamaURL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "model": this.modelId
      })
    })

    const reader = res.body?.getReader();
    if (!reader) {
      console.warn("No reader!");
      return { success: false }
    }
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();

      let chunk = "[" + decoder.decode(value, { stream: true }).replace(/\n/g, ",")
      if (chunk.endsWith(",")) chunk = chunk.slice(0, chunk.length - 1)
      chunk += "]"

      const chunkObj = JSON.parse(chunk) as OllamaPullResponseChunk[]

      for (const item of chunkObj) {
        this.status = item.status
      }

      if (done) break;
    }
    this.status = "Already Installed"
    return { success: true }

  }
}


export const defaultCloudflareModel = new CloudflareModel("AI Worker:Online", "https://hello-ai.kruceo.workers.dev")
defaultCloudflareModel.type = "cloudflare-default"