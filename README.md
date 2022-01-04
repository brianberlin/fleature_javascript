# Fleature Javascript Client

This is a basic javascript client for Fleature.

### Example Usage

Setup fleature somewhere in the top level of you app.

```javascript
import fleature from 'fleature'

fleature.setup({
  clientId: 'XXX',
  clientSecret: 'XXX',
  enabledFlags: ["feature_flag_name"]
})
```
Example usage in a react component

```javascript
import {React, useEffect} from 'react'
import fleature from 'fleature'

function MyComponent() {
    const [flag, setFlag] = useState(false)

    useEffect(() => {
        const flagName = 'javascript_feature_flag'
        const unsubscribe = fleature.subscribe(flagName, setFlagState)
        return () => unsubscribe()
    })

    return (
        <div>State of javascript_feature_flag is ${flag}</div>
    )
}
```